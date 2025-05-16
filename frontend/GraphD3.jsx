import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useVehicleData } from './src/VehicleContext';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

const GraphD3 = () => {
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const { vehicles } = useVehicleData();

    // Color theme for battery SoC levels
    const getSocColor = (soc) => {
        if (soc < 30) return '#f44336'; // Red
        if (soc < 50) return '#ff9800'; // Yellow/Orange
        if (soc < 80) return '#2196f3'; // Blue
        return '#4caf50'; // Green
    };

    // Color theme for temperature (10-50°C)
    const getTempColor = (temp) => {
        // Normalize temp between 0-1 for color scale (10-50°C range)
        const normalizedTemp = Math.max(0, Math.min(1, (temp - 10) / 40));
        return d3.interpolateRdYlBu(1 - normalizedTemp); // Reversed so red is hot
    };

    useEffect(() => {
        if (!vehicles || Object.keys(vehicles).length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        // Adjusted margins to provide more space for labels.  Crucially, increased bottom margin.
        const margin = { top: 60, right: 80, bottom: 130, left: 70 };
        const width = svg.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale = d3.scaleBand()
            .domain(Object.values(vehicles).map(d => d.model_name))
            .range([0, width])
            .padding(0.3);

        // Y scale for SoC (left side)
        const yScaleSoC = d3.scaleLinear()
            .domain([0, 100]) // SoC is percentage
            .range([height, 0]);

        // Y scale for Temperature (right side)
        const yScaleTemp = d3.scaleLinear()
            .domain([0, 50]) // Temperature range 0-50°C
            .range([height, 0]);

        // Set up tooltip once
        if (!tooltipRef.current) {
            tooltipRef.current = d3.select("body")
                .append("div")
                .attr("class", "d3-tooltip")
                .style("position", "absolute")
                .style("background-color", alpha('#fff', 0.95))
                .style("color", "#333")
                .style("border", `1px solid ${alpha('#000', 0.2)}`)
                .style("border-radius", "8px")
                .style("padding", "10px 12px")
                .style("font-family", "'Roboto','Helvetica','Arial',sans-serif")
                .style("font-size", "0.875rem")
                .style("box-shadow", "0px 4px 20px rgba(0, 0, 0, 0.12)")
                .style("pointer-events", "none")
                .style("z-index", "1500")
                .style("opacity", 0);
        }

        const tooltip = tooltipRef.current;

        // Draw bars for SoC
        g.selectAll('.bar-soc')
            .data(Object.values(vehicles))
            .enter()
            .append('rect')
            .attr('class', 'bar-soc')
            .attr('x', d => xScale(d.model_name))
            .attr('y', d => yScaleSoC(d.battery_soc || 0))
            .attr('width', xScale.bandwidth() / 2)
            .attr('height', d => height - yScaleSoC(d.battery_soc || 0))
            .attr('fill', d => getSocColor(d.battery_soc || 0))
            .on("mouseover", function(event, d) {
                tooltip.style("opacity", 0.9)
                    .html(`
                        <strong>Car:</strong> ${d.model_name}<br>
                        <strong>SoC:</strong> ${d.battery_soc || 0}%
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
            });

        // Draw temperature bars with their own scale
        g.selectAll('.bar-temp')
            .data(Object.values(vehicles).filter(d => d.battery_temp !== undefined))
            .enter()
            .append('rect')
            .attr('class', 'bar-temp')
            .attr('x', d => xScale(d.model_name) + xScale.bandwidth() / 2)
            .attr('y', d => yScaleTemp(d.battery_temp))
            .attr('width', xScale.bandwidth() / 2)
            .attr('height', d => height - yScaleTemp(d.battery_temp))
            .attr('fill', d => getTempColor(d.battery_temp))
            .attr('stroke', '#333')
            .attr('stroke-width', 0.5)
            .on("mouseover", function(event, d) {
                tooltip.style("opacity", 0.9)
                    .html(`
                        <strong>Car:</strong> ${d.model_name}<br>
                        <strong>Temp:</strong> ${d.battery_temp}°C
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
            });

        // X-axis with rotated labels
        const xAxis = g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        xAxis.selectAll('text')
            .style('text-anchor', 'end')
            .style('font-size', '10px') // Reduced font size
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-60)'); // Steeper rotation

        // Calculate the maximum height of the rotated labels
        let maxLabelHeight = 0;
        xAxis.selectAll('text').each(function () {
            const bbox = this.getBBox();
            maxLabelHeight = Math.max(maxLabelHeight, bbox.height);
        });

        // Left Y-axis (SoC)
        g.append('g')
            .attr('class', 'y-axis-soc')
            .call(d3.axisLeft(yScaleSoC).ticks(10))
            .selectAll('text')
            .style('font-size', '11px');

        // Right Y-axis (Temperature)
        g.append('g')
            .attr('class', 'y-axis-temp')
            .attr('transform', `translate(${width}, 0)`)
            .call(d3.axisRight(yScaleTemp).ticks(10))
            .selectAll('text')
            .style('font-size', '11px');

        // X-axis label
        g.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            // Use the calculated maxLabelHeight to position the label below the rotated labels
            .attr('y', height + margin.bottom - 10)  // Position below rotated labels, with some extra padding
            .style('font-size', '12px')
            .text('Vehicle Models');

        // Left Y-axis label (SoC)
        g.append('text')
            .attr('class', 'y-label-soc')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -50)
            .style('font-size', '12px')
            .text('Battery SoC (%)');

        // Right Y-axis label (Temperature)
        g.append('text')
            .attr('class', 'y-label-temp')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(90)')
            .attr('x', height / 2)
            .attr('y', width + 50)
            .style('font-size', '12px')
            .text('Battery Temperature (°C)');

        // Title
        g.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', -30)
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            

        // Legend for SoC
        const socLegend = [
            { label: '< 30%', color: '#f44336' },
            { label: '30-50%', color: '#ff9800' },
            { label: '50-80%', color: '#2196f3' },
            { label: '> 80%', color: '#4caf50' }
        ];

        const legend = g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(0, -35)`);

        // SoC Legend title
        legend.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .text('Battery SoC:');

        // SoC Legend items (horizontal)
        legend.selectAll('.legend-item')
            .data(socLegend)
            .enter()
            .append('rect')
            .attr('class', 'legend-item')
            .attr('x', (d, i) => 70 + i * 80)
            .attr('y', -15)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', d => d.color);

        legend.selectAll('.legend-text')
            .data(socLegend)
            .enter()
            .append('text')
            .attr('class', 'legend-text')
            .attr('x', (d, i) => 85 + i * 80)
            .attr('y', -5)
            .style('font-size', '9px')
            .text(d => d.label);

        // Temperature Legend
        const tempLegend = g.append('g')
            .attr('class', 'temp-legend')
            .attr('transform', `translate(${width - 280}, -35)`);

        tempLegend.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .text('Temperature:');

        // Temperature legend items (horizontal)
        const tempLegendData = [
            { temp: 50, label: 'Hot (50°C)' },
            { temp: 30, label: 'Warm (30°C)' },
            { temp: 10, label: 'Cool (10°C)' }
        ];

        tempLegend.selectAll('.temp-legend-rect')
            .data(tempLegendData)
            .enter()
            .append('rect')
            .attr('class', 'temp-legend-rect')
            .attr('x', (d, i) => 70 + i * 80)
            .attr('y', -15)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', d => getTempColor(d.temp));

        tempLegend.selectAll('.temp-legend-text')
            .data(tempLegendData)
            .enter()
            .append('text')
            .attr('class', 'temp-legend-text')
            .attr('x', (d, i) => 85 + i * 80)
            .attr('y', -5)
            .style('font-size', '9px')
            .text(d => d.label);

    }, [vehicles]);

    return (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
                Vehicle Battery Analysis
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' , width: '100%'}}>
                <Box sx={{  width: '100%' }}>
                    <svg ref={svgRef} width="100%" height="500" /> {/* height: '600px' removed */}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Battery state of charge (SoC) and temperature side by side
                </Typography>
            </Box>
        </Box>
    );
};

export default GraphD3;
